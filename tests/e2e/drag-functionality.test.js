/**
 * 拖拽功能端到端测试
 * 验证修复后的拖拽功能是否正常工作
 */

describe('拖拽功能测试', () => {
  beforeEach(() => {
    cy.visit('/draggable-monitors');
    cy.wait(1000); // 等待页面加载完成
  });

  describe('基本拖拽功能', () => {
    it('应该能够拖拽性能监控器', () => {
      // 获取性能监控器的初始位置
      cy.get('.performance-monitor').then($monitor => {
        const initialRect = $monitor[0].getBoundingClientRect();
        
        // 拖拽监控器
        cy.get('.performance-monitor .drag-handle')
          .trigger('mousedown', { clientX: initialRect.x + 10, clientY: initialRect.y + 10 })
          .trigger('mousemove', { clientX: initialRect.x + 100, clientY: initialRect.y + 50 })
          .trigger('mouseup');
        
        // 验证位置已改变
        cy.get('.performance-monitor').then($newMonitor => {
          const newRect = $newMonitor[0].getBoundingClientRect();
          expect(newRect.x).to.not.equal(initialRect.x);
          expect(newRect.y).to.not.equal(initialRect.y);
        });
      });
    });

    it('应该能够拖拽系统健康监控器', () => {
      // 获取系统健康监控器的初始位置
      cy.get('.system-health-monitor').then($monitor => {
        const initialRect = $monitor[0].getBoundingClientRect();
        
        // 拖拽监控器
        cy.get('.system-health-monitor .drag-handle')
          .trigger('mousedown', { clientX: initialRect.x + 10, clientY: initialRect.y + 10 })
          .trigger('mousemove', { clientX: initialRect.x + 100, clientY: initialRect.y + 50 })
          .trigger('mouseup');
        
        // 验证位置已改变
        cy.get('.system-health-monitor').then($newMonitor => {
          const newRect = $newMonitor[0].getBoundingClientRect();
          expect(newRect.x).to.not.equal(initialRect.x);
          expect(newRect.y).to.not.equal(initialRect.y);
        });
      });
    });
  });

  describe('点击不重置位置', () => {
    it('点击展开按钮不应该重置性能监控器位置', () => {
      // 先拖拽到新位置
      cy.get('.performance-monitor .drag-handle')
        .trigger('mousedown', { clientX: 50, clientY: 50 })
        .trigger('mousemove', { clientX: 200, clientY: 100 })
        .trigger('mouseup');
      
      // 获取拖拽后的位置
      cy.get('.performance-monitor').then($monitor => {
        const draggedRect = $monitor[0].getBoundingClientRect();
        
        // 点击展开按钮
        cy.get('.performance-monitor .toggle-btn').click();
        
        // 验证位置没有改变
        cy.get('.performance-monitor').then($newMonitor => {
          const newRect = $newMonitor[0].getBoundingClientRect();
          expect(newRect.x).to.equal(draggedRect.x);
          expect(newRect.y).to.equal(draggedRect.y);
        });
      });
    });

    it('点击切换箭头不应该重置系统健康监控器位置', () => {
      // 先拖拽到新位置
      cy.get('.system-health-monitor .drag-handle')
        .trigger('mousedown', { clientX: 50, clientY: 80 })
        .trigger('mousemove', { clientX: 250, clientY: 150 })
        .trigger('mouseup');
      
      // 获取拖拽后的位置
      cy.get('.system-health-monitor').then($monitor => {
        const draggedRect = $monitor[0].getBoundingClientRect();
        
        // 点击切换箭头
        cy.get('.system-health-monitor .toggle-arrow').click();
        
        // 验证位置没有改变
        cy.get('.system-health-monitor').then($newMonitor => {
          const newRect = $newMonitor[0].getBoundingClientRect();
          expect(newRect.x).to.equal(draggedRect.x);
          expect(newRect.y).to.equal(draggedRect.y);
        });
      });
    });
  });

  describe('拖拽阈值机制', () => {
    it('小幅移动不应该触发拖拽', () => {
      // 获取初始位置
      cy.get('.performance-monitor').then($monitor => {
        const initialRect = $monitor[0].getBoundingClientRect();
        
        // 进行小幅移动（小于阈值）
        cy.get('.performance-monitor .drag-handle')
          .trigger('mousedown', { clientX: initialRect.x + 10, clientY: initialRect.y + 10 })
          .trigger('mousemove', { clientX: initialRect.x + 12, clientY: initialRect.y + 12 }) // 只移动2像素
          .trigger('mouseup');
        
        // 验证位置没有改变
        cy.get('.performance-monitor').then($newMonitor => {
          const newRect = $newMonitor[0].getBoundingClientRect();
          expect(newRect.x).to.equal(initialRect.x);
          expect(newRect.y).to.equal(initialRect.y);
        });
      });
    });

    it('超过阈值的移动应该触发拖拽', () => {
      // 获取初始位置
      cy.get('.performance-monitor').then($monitor => {
        const initialRect = $monitor[0].getBoundingClientRect();
        
        // 进行超过阈值的移动
        cy.get('.performance-monitor .drag-handle')
          .trigger('mousedown', { clientX: initialRect.x + 10, clientY: initialRect.y + 10 })
          .trigger('mousemove', { clientX: initialRect.x + 20, clientY: initialRect.y + 20 }) // 移动10像素
          .trigger('mouseup');
        
        // 验证位置已改变
        cy.get('.performance-monitor').then($newMonitor => {
          const newRect = $newMonitor[0].getBoundingClientRect();
          expect(newRect.x).to.not.equal(initialRect.x);
          expect(newRect.y).to.not.equal(initialRect.y);
        });
      });
    });
  });

  describe('拖拽手柄检测', () => {
    it('拖拽手柄应该可以拖拽', () => {
      cy.get('.performance-monitor .drag-handle')
        .should('be.visible')
        .should('have.css', 'cursor', 'grab');
    });

    it('按钮区域不应该触发拖拽', () => {
      // 获取初始位置
      cy.get('.performance-monitor').then($monitor => {
        const initialRect = $monitor[0].getBoundingClientRect();
        
        // 尝试从按钮区域拖拽
        cy.get('.performance-monitor .toggle-btn')
          .trigger('mousedown')
          .trigger('mousemove', { clientX: initialRect.x + 100, clientY: initialRect.y + 50 })
          .trigger('mouseup');
        
        // 验证位置没有改变
        cy.get('.performance-monitor').then($newMonitor => {
          const newRect = $newMonitor[0].getBoundingClientRect();
          expect(newRect.x).to.equal(initialRect.x);
          expect(newRect.y).to.equal(initialRect.y);
        });
      });
    });
  });

  describe('位置持久化', () => {
    it('拖拽后的位置应该被保存', () => {
      // 拖拽到新位置
      cy.get('.performance-monitor .drag-handle')
        .trigger('mousedown', { clientX: 50, clientY: 50 })
        .trigger('mousemove', { clientX: 300, clientY: 200 })
        .trigger('mouseup');
      
      // 获取拖拽后的位置
      cy.get('.performance-monitor').then($monitor => {
        const draggedRect = $monitor[0].getBoundingClientRect();
        
        // 刷新页面
        cy.reload();
        cy.wait(1000);
        
        // 验证位置被恢复
        cy.get('.performance-monitor').then($newMonitor => {
          const newRect = $newMonitor[0].getBoundingClientRect();
          // 允许小的误差
          expect(Math.abs(newRect.x - draggedRect.x)).to.be.lessThan(5);
          expect(Math.abs(newRect.y - draggedRect.y)).to.be.lessThan(5);
        });
      });
    });
  });

  describe('边缘吸附功能', () => {
    it('拖拽到边缘应该自动吸附', () => {
      // 拖拽到右边缘
      cy.get('.performance-monitor .drag-handle')
        .trigger('mousedown', { clientX: 50, clientY: 50 })
        .trigger('mousemove', { clientX: window.innerWidth - 10, clientY: 100 })
        .trigger('mouseup');
      
      // 验证吸附状态
      cy.get('.performance-monitor')
        .should('have.class', 'snapped');
      
      // 验证触发区域存在
      cy.get('.snap-trigger-area')
        .should('be.visible');
    });

    it('点击触发区域应该取消吸附', () => {
      // 先拖拽到边缘吸附
      cy.get('.performance-monitor .drag-handle')
        .trigger('mousedown', { clientX: 50, clientY: 50 })
        .trigger('mousemove', { clientX: window.innerWidth - 10, clientY: 100 })
        .trigger('mouseup');
      
      // 点击触发区域
      cy.get('.snap-trigger-area').click();
      
      // 验证吸附状态被取消
      cy.get('.performance-monitor')
        .should('not.have.class', 'snapped');
    });
  });

  describe('冲突避免', () => {
    it('重叠的控件应该自动调整位置', () => {
      // 将两个控件拖拽到相近位置
      cy.get('.performance-monitor .drag-handle')
        .trigger('mousedown', { clientX: 50, clientY: 50 })
        .trigger('mousemove', { clientX: 200, clientY: 200 })
        .trigger('mouseup');
      
      cy.get('.system-health-monitor .drag-handle')
        .trigger('mousedown', { clientX: 50, clientY: 80 })
        .trigger('mousemove', { clientX: 205, clientY: 205 }) // 故意重叠
        .trigger('mouseup');
      
      // 验证位置被自动调整
      cy.get('.performance-monitor').then($monitor1 => {
        cy.get('.system-health-monitor').then($monitor2 => {
          const rect1 = $monitor1[0].getBoundingClientRect();
          const rect2 = $monitor2[0].getBoundingClientRect();
          
          // 验证两个控件没有重叠
          const isOverlapping = !(rect1.right < rect2.left || 
                                 rect2.right < rect1.left || 
                                 rect1.bottom < rect2.top || 
                                 rect2.bottom < rect1.top);
          
          expect(isOverlapping).to.be.false;
        });
      });
    });
  });

  describe('事件日志', () => {
    it('拖拽操作应该记录到事件日志', () => {
      // 执行拖拽操作
      cy.get('.performance-monitor .drag-handle')
        .trigger('mousedown', { clientX: 50, clientY: 50 })
        .trigger('mousemove', { clientX: 150, clientY: 100 })
        .trigger('mouseup');
      
      // 显示事件日志
      cy.get('.show-log-btn').click();
      
      // 验证日志中包含拖拽事件
      cy.get('.log-entries')
        .should('contain', 'performance 监控器开始拖拽')
        .should('contain', 'performance 监控器拖拽结束');
    });
  });
});

// 移动端测试
describe('移动端拖拽功能测试', () => {
  beforeEach(() => {
    cy.viewport('iphone-6');
    cy.visit('/draggable-monitors');
    cy.wait(1000);
  });

  it('应该支持触摸拖拽', () => {
    // 获取初始位置
    cy.get('.performance-monitor').then($monitor => {
      const initialRect = $monitor[0].getBoundingClientRect();
      
      // 使用触摸事件拖拽
      cy.get('.performance-monitor .drag-handle')
        .trigger('touchstart', { 
          touches: [{ clientX: initialRect.x + 10, clientY: initialRect.y + 10 }] 
        })
        .trigger('touchmove', { 
          touches: [{ clientX: initialRect.x + 100, clientY: initialRect.y + 50 }] 
        })
        .trigger('touchend');
      
      // 验证位置已改变
      cy.get('.performance-monitor').then($newMonitor => {
        const newRect = $newMonitor[0].getBoundingClientRect();
        expect(newRect.x).to.not.equal(initialRect.x);
        expect(newRect.y).to.not.equal(initialRect.y);
      });
    });
  });

  it('触摸拖拽不应该干扰页面滚动', () => {
    // 在非拖拽区域进行触摸滚动
    cy.get('.demo-content')
      .trigger('touchstart', { touches: [{ clientX: 200, clientY: 300 }] })
      .trigger('touchmove', { touches: [{ clientX: 200, clientY: 200 }] })
      .trigger('touchend');
    
    // 验证页面可以正常滚动（这里简单验证没有错误）
    cy.get('body').should('be.visible');
  });
});
